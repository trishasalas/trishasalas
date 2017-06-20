<?php
/**
 * Jetpack Compatibility File.
 *
 * @link http://jetpack.me/
 *
 * @package TrishaSalas
 */

/**
 * Add theme support for Infinite Scroll.
 * See: https://jetpack.me/support/infinite-scroll/
 */
function trishasalas_jetpack_setup() {
	add_theme_support( 'infinite-scroll', array(
		'container' => 'main',
		'render'    => 'trishasalas_infinite_scroll_render',
		'footer'    => 'page',
	) );
}
add_action( 'after_setup_theme', 'trishasalas_jetpack_setup' );

/**
 * Custom render function for Infinite Scroll.
 */
function trishasalas_infinite_scroll_render() {
	while ( have_posts() ) {
		the_post();
		get_template_part( 'page-templates/content', get_post_format() );
	}
}
