<?php

namespace Derweili\Flaticon;


add_filter( 'block_categories', function( $categories, $post ) {
	return array_merge(
		$categories,
		[
			[
                'slug' => 'derweili-flaticon',
                'icon' => 'wordpress-alt',
				'title' => __( 'JS for WP - Advanced Blocks', 'derweili-flaticon' ),
			],
		]
	);
}, 10, 2 );