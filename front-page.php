<?php
/**
 * The front-page.php template file.
 *
 * Learn more: http://codex.wordpress.org/Template_Hierarchy
 *
 * @package TrishaSalas
 */

get_header(); ?>

<?php
$logo = file_get_contents( get_template_directory() . '/assets/dist/svg/logo.svg' );
?>
	<div class="branding">
		<div class="logo">
			<a href="<?php esc_attr_e( home_url( '/' ) ); ?>" rel="home">
				<?php
				if ( ! empty( $logo ) ) {
					echo $logo;
				}
				?>
			</a>
			<p>
				<?php
				esc_html_e (
					'Front-End Developer // Accessibility Advocate',
					'trishasalas'
				);
				?>
			</p>
		</div>
	</div>

	<h4 class="widget-title">Some of my amazing clients</h4>

	<div class="client-logos row">
		<div class="logo">
			<img src="<?php echo get_template_directory_uri(); ?>/assets/img/logos/mozilla-logo.png" alt="Mozilla Logo">
		</div>
		<div class="logo">
			<img src="<?php echo get_template_directory_uri(); ?>/assets/img/logos/rl_hudson.png" alt="RL Hudson Logo">
		</div>
		<div class="logo">
			<img src="<?php echo get_template_directory_uri(); ?>/assets/img/logos/tb-logo.png" alt="Tulsa Ballet Logo">
		</div>
		<div class="logo">
			<img src="<?php echo get_template_directory_uri(); ?>/assets/img/logos/cyberchimps.png" alt="Cyberchips Logo">
		</div>
		<div class="logo">
			<img src="<?php echo get_template_directory_uri(); ?>/assets/img/logos/rg_logo.png" alt="Rosemary Garrison Yoga logo">
		</div>
		<div class="logo">
			<img src="<?php echo get_template_directory_uri(); ?>/assets/img/logos/events-logo-new.png" alt="events.com logo">
		</div>
	</div>

	<div class="newsletter row">
		<form
			class="tiny-letter"
			style="background: #f5f5f5;"
			action="https://tinyletter.com/trishasalas"
			method="post"
			target="popupwindow"
			onsubmit="window.open('https://tinyletter.com/trishasalas', 'popupwindow', 'scrollbars=yes,width=800,height=600');
			return true"
		>
			<div class="form-inner">
				<h5 class="tiny-letter-heading widget-title">Subscribe to My Newsletter</h5>
				<div class="email-input">
					<input
						aria-label="email"
						class="text"
						type="text"
						style="background:#fff;"
						name="email"
						id="tlemail"
					>
					<input
						type="hidden"
						value="1"
						name="embed"
					>
				</div>
				<div class="submit">
					<input
						class="submit-button"
						type="submit"
						value="Subscribe"
					>
				</div>
			</div>
		</form>
	</div>

	<div class="posts home row">
		<?php
		// WP_Query arguments
		$args = array(
			'category_name' => 'portfolio',
			'post_status' => 'publish',
			'posts_per_page' => 3
		);

		// The Query
		$portfolios = get_posts( $args );
		foreach ( $portfolios as $portfolio ) :
				?>
				<article class="portfolio-item">
						<div class="featured-image">
							<?php echo get_the_post_thumbnail( $portfolio->ID );?>
						</div>
						<header class="entry-header" aria-hidden="true">
							<h2 class="entry-title"><a href="<?php the_permalink( $portfolio->ID );?>" rel="bookmark"><?php echo get_the_title( $portfolio->ID ); ?></a></h2>
						</header>
						<div class="entry-content">
							<?php echo wp_trim_words( get_the_content(), 24, '...' ); ?>
							<a class="button" href="<?php the_permalink( $portfolio->ID );?>">Read More</a>
						</div>
				</article>
				<?php
			endforeach;
		?>
	</div>

<?php
get_footer();