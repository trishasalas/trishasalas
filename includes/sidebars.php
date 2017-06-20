<?php

namespace trishasalas;

/**
 * Register widget area.
 */
add_action( 'widgets_init', function() {

	register_sidebar( array(
		'name'          => esc_html__( 'Header', 'trishasalas' ),
		'id'            => 'header',
		'description'   => '',
		'before_widget' => '<section id="%1$s" class="widget %2$s">',
		'after_widget'  => '</section>',
	) );

	register_sidebar( array(
		'name'          => esc_html__( 'Sidebar', 'trishasalas' ),
		'id'            => 'sidebar-1',
		'description'   => '',
		'before_widget' => '<section id="%1$s" class="widget %2$s">',
		'after_widget'  => '</section>',
		'before_title'  => '<h2 class="widget-title">',
		'after_title'   => '</h2>',
	) );

	register_sidebar( array(
		'name'          => esc_html__( 'Footer', 'trishasalas' ),
		'id'            => 'footer',
		'description'   => '',
		'before_widget' => '<div id="%1$s" class="widget %2$s">',
		'after_widget'  => '</div>',
		'before_title'  => '<h5 class="widget-title">',
		'after_title'   => '</h5>',
	) );

} );