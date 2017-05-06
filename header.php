<?php
/**
 * The header for our theme.
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package Heisenberg
 */
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="profile" href="http://gmpg.org/xfn/11">
    <link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>">

	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>

<?php
$svg_sprite = file_get_contents( get_template_directory() . '/assets/dist/sprite/sprite.svg' );
if ( file_exists( $svg_sprite ) ) {
	echo $svg_sprite;
} ?>

<div class="off-canvas-wrapper">
    <div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>
        <div class="title-bar show-for-small-only">
            <div class="title-bar-left">
                <button class="menu-icon" type="button" data-toggle="offCanvasLeft"></button>
                <span class="title-bar-title"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></span>
            </div>
        </div>
        <div class="off-canvas position-left" id="offCanvasLeft" data-off-canvas>
            <button class="close-button" aria-label="Close menu" type="button" data-close>
                <span aria-hidden="true">&times;</span>
            </button>
			<?php
			$args = [
				'theme_location'  => 'primary',
				'container'       => 'nav',
				'container_class' => 'offcanvas-navigation',
				'menu_class'      => 'mobile-menu',
			];
			wp_nav_menu( $args ); ?>
        </div>
        <div class="off-canvas-content" data-off-canvas-content>
            <header id="masthead" class="" role="banner">
                <section class="row column">
                    <h1 class="site-title">
                        <a href="<?php esc_attr_e( home_url( '/' ) ); ?>" rel="home">
							<?php echo esc_html( get_bloginfo( 'name' ) ); ?>
                        </a>
                    </h1>
                    <h2 class="site-description"><?php echo esc_html( get_bloginfo( 'description' ) ); ?></h2>
                </section>
                <div class="top-bar show-for-medium">
                    <div class="top-bar-left row column">
						<?php
						$args = [
							'theme_location' => 'primary',
							'container'      => '',
						];
						wp_nav_menu( $args ); ?>
                    </div>
                </div>
            </header>
            <div id="content" class="site-content">