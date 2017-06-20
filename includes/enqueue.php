<?php

namespace TrishaSalas;

/**
 * Enqueue styles
 */
add_action( 'wp_enqueue_scripts', function() {

	wp_enqueue_style(
		'trishasalas_styles',
		TRISHASALAS_URL . '/assets/dist/css/app.css',
		'',
		TRISHASALAS_VERSION,
		''
	);

	wp_enqueue_style(
		'trishasalas-fonts',
		'//fonts.googleapis.com/css?family=Satisfy|Fira+Mono:400,500,700|Raleway:400,500,700,900&amp;subset=latin-ext',
		false
	);

	wp_enqueue_style(
		'trishasalas-prismcss',
		TRISHASALAS_URL . '/assets/dist/css/prism.css',
		false
	);

} );

/**
 * Enqueue scripts
 */
add_action( 'wp_enqueue_scripts', function() {

	// Add Foundation JS to footer
	wp_enqueue_script(
		'foundation-js',
		TRISHASALAS_URL . '/assets/dist/js/foundation.js',
		['jquery'],
		'6.2.4',
		true
	);

	// Add our main app js file
	wp_enqueue_script(
		'trishasalas_appjs',
		TRISHASALAS_URL . '/assets/dist/js/app.js',
		['jquery'],
		TRISHASALAS_VERSION,
		true
	);

	wp_enqueue_script(
		'trishasalas_prismjs',
		TRISHASALAS_URL . '/assets/dist/js/prism.js',
		'',
		TRISHASALAS_VERSION,
		true
	);

	//wp_enqueue_script(
	//	'trishasalas_menu',
	//	TRISHASALAS_URL . '/assets/dist/js/menu.js',
	//	'',
	//	TRISHASALAS_VERSION,
	//	true
	//);


	// Add comment script on single posts with comments
	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
} );