<?php
/**
 * The header for our theme.
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package TrishaSalas
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
$codepen   = file_get_contents( get_template_directory() . '/assets/dist/svg/codepen.svg' );
$email     = file_get_contents( get_template_directory() . '/assets/dist/svg/send-o.svg' );
$github    = file_get_contents( get_template_directory() . '/assets/dist/svg/github.svg' );
$linkedin  = file_get_contents( get_template_directory() . '/assets/dist/svg/linkedin.svg' );
$twitter   = file_get_contents( get_template_directory() . '/assets/dist/svg/twitter.svg' );
$wordpress = file_get_contents( get_template_directory() . '/assets/dist/svg/wordpress.svg' );
$logomark  = file_get_contents( get_template_directory() . '/assets/dist/svg/logomark.svg' );
$menu_icon = file_get_contents( get_template_directory() . '/assets/dist/svg/icon-menu.svg' );
$home      = file_get_contents( get_template_directory() . '/assets/dist/svg/home.svg' );
?>

<header id="masthead" class="site-header" role="banner">
	<div class="masthead">
		<div class="left">
			<div class="site-title">
				<a href="<?php esc_attr_e( home_url( '/' ) ); ?>" rel="home">
					<?php esc_html_e( 'Trisha Salas', 'trishasalas' ); ?>
				</a>
			</div>

		</div>
		<div class="right">
			<ul class="social">
				<li class="send">
					<a href="/contact">
						<?php
						if ( ! empty( $email ) ) {
							echo $email;
						}
						?>
					</a>
				</li>
				<li class="twitter">
					<a href="https://twitter.com/trishacodes">
						<?php
						if ( ! empty( $twitter ) ) {
							echo $twitter;
						}
						?>
					</a>
				</li>
				<li class="github">
					<a href="https://github.com/trishasalas">
						<?php
						if ( ! empty( $github ) ) {
							echo $github;
						}
						?>
					</a>
				</li>
				<li class="wordpress">
					<a href="https://profiles.wordpress.org/trishasalas/">
						<?php
						if ( ! empty( $wordpress ) ) {
							echo $wordpress;
						}
						?>
					</a>
				</li>
				<li class="codepen">
					<a href="http://codepen.io/trishasalas/">
						<?php
						if ( ! empty( $codepen ) ) {
							echo $codepen;
						}
						?>
					</a>
				</li>
				<li class="linkedin">
					<a href="https://www.linkedin.com/in/trishasalas/">
						<?php
						if ( ! empty( $linkedin ) ) {
							echo $linkedin;
						}
						?>
					</a>
				</li>
			</ul>
		</div>
	</div>
	<?php
	$args = [
		'theme_location'  => 'primary',
		'container'       => '',
		'container_class' => '',
		'menu_class'      => 'menu',
	];
	wp_nav_menu( $args );
	?>
</header>