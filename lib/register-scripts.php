<?php

namespace Derweili\Flaticon;


add_action( "enqueue_block_editor_assets", __NAMESPACE__ . '\plugin_scripts', 100 );
/**
 * Enqueue block frontend JavaScript
 */
function plugin_scripts(){

	$plugins_js_path = "/assets/js/plugins.editor.js";
	$plugins_style_path = '/assets/css/plugins.editor.css';


	// Enqueue our plugin JavaScript
	wp_enqueue_script(
		"derweili-flaticon-plugins-js",
		_get_plugin_url() . $plugins_js_path,
		$js_dependencies,
		filemtime( _get_plugin_directory() . $plugins_js_path ),
		true
	);

	// Enqueue our plugin JavaScript
	wp_enqueue_style(
		"derweili-flaticon-plugins-css",
		_get_plugin_url() . $plugins_style_path,
		[],
		filemtime( _get_plugin_directory() . $plugins_style_path )
	);
}
