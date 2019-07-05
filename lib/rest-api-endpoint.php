<?php 

namespace Derweili\Flaticon;

define( 'DERWEILI_FLATICON_REST_NAMESPACE', 'flaticon/v1' );
define( 'DERWEILI_FLATICON_API_KEY_SETTING', 'derweili-flaticon-api-key' );

add_action( 'rest_api_init', __NAMESPACE__ . '\custom_endpoints' );
/**
 * Create custom endpoints for block settings
 */
function custom_endpoints() {

    register_rest_route(
        DERWEILI_FLATICON_REST_NAMESPACE,
        'api-key/',
        [
            'methods' => \WP_REST_Server::READABLE,
            'callback' => __NAMESPACE__ . '\get_api_key',
            'permission_callback' => __NAMESPACE__ . '\get_api_key'
        ]
    );

    register_rest_route(
        DERWEILI_FLATICON_REST_NAMESPACE,
        'api-key/',
        [
            'methods' => \WP_REST_Server::EDITABLE,
            'callback' => __NAMESPACE__ . '\update_api_key',
            'permission_callback' => __NAMESPACE__ . '\check_permissions'
        ]
    );

    register_rest_route(
        DERWEILI_FLATICON_REST_NAMESPACE,
        'import-image/',
        [
            'methods' => \WP_REST_Server::EDITABLE,
            'callback' => __NAMESPACE__ . '\import_icon',
            'permission_callback' => __NAMESPACE__ . '\check_permissions'
        ]
    );

}


function import_icon( $request ) {

    $request_data = $request->get_body();

    $attachment_id = importMedia(json_decode($request_data, true));

    $return = array(
        'id' => $attachment_id,
        'url' => wp_get_attachment_image_src($attachment_id, 'full')[0]
    );

    // var_dump($attachment_id);
    
    $response = new \WP_REST_Response( $return );
    $response->set_status(201);

    return $response;

}

function check_permissions() {
    return current_user_can("upload_files");
}


function importMedia( $image ){

    $image = $image["image_data"];

    $image_url = $image["images"]["svg"];
    $image_name = $image["id"] . '.svg';
    $image_description = $image['description'];
    $upload_dir       = wp_upload_dir(); // Set upload folder
    $image_data       = file_get_contents($image_url); // Get image data
    
    $unique_file_name = wp_unique_filename( $upload_dir['path'], $image_name ); // Generate unique name
    $filename         = basename( $unique_file_name ); // Create image file name
    // Check folder permission and define file location
    if( wp_mkdir_p( $upload_dir['path'] ) ) {
        $file = $upload_dir['path'] . '/' . $filename;
    } else {
        $file = $upload_dir['basedir'] . '/' . $filename;
    }
    // Create the image  file on the server
    file_put_contents( $file, $image_data );
    // Check image file type
    $wp_filetype = wp_check_filetype( $filename, null );
    // Set attachment data
    $attachment = array(
        'post_mime_type' => 'image/svg+xml',
        'post_title'     => sanitize_file_name( $filename ),
        'post_content'   => $image_description,
        'post_status'    => 'inherit'
    );
    // Create the attachment
    $attach_id = wp_insert_attachment( $attachment, $file, 0 );
    // Include image.php
    require_once(ABSPATH . 'wp-admin/includes/image.php');
    // Define attachment metadata
    $attach_data = wp_generate_attachment_metadata( $attach_id, $file );
    // Assign metadata to attachment
    wp_update_attachment_metadata( $attach_id, $attach_data );
    
    return $attach_id;


  }




function get_api_key(){

    $api_key = get_option( DERWEILI_FLATICON_API_KEY_SETTING );
    $response = new \WP_REST_Response( $api_key );
    $response->set_status(200);
    return $response;
}
function update_api_key( $request ) {
    $new_api_key = $request->get_body();
    update_option( DERWEILI_FLATICON_API_KEY_SETTING, $new_api_key );
    $api_key = get_option( DERWEILI_FLATICON_API_KEY_SETTING );
    $response = new \WP_REST_Response( $api_key );
    $response->set_status(201);
    return $response;
}