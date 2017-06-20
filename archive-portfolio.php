<?php
/**
 * The template for displaying archive pages.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package TrishaSalas
 */

get_header(); ?>


	<header class="page-header">
		<h1 class="page-title">
			<?php echo '['; ?><?php single_term_title(); ?><?php echo ']'; ?>
		</h1>
	</header>
	<div class="content-wrap">
		<div class="row">

			<div class="medium-6 columns">

				<div id="primary" class="content-area">

					<main id="main" class="site-main" role="main">
						<?php
						if ( have_posts() ) : ?>

							<?php
							while ( have_posts() ) :

								the_post();

								?>
								<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
									<header class="entry-header">
										<?php the_title( sprintf( '<h2 class="entry-title"><a href="%s" rel="bookmark">', esc_url( get_permalink() ) ), '</a></h2>' ); ?>
									</header><!-- .entry-header -->

									<div class="entry-content">
										<?php
										the_post_thumbnail()
										?>

										<?php
										wp_link_pages( array(
											'before' => '<div class="page-links">' . esc_html__( 'Pages:', 'trishasalas' ),
											'after'  => '</div>',
										) );
										?>
									</div><!-- .entry-content -->

									<footer class="entry-footer">
										<?php trishasalas_entry_footer(); ?>
									</footer><!-- .entry-footer -->
								</article><!-- #post-## -->
								<?php

						endwhile;
						endif;?>

					</main>

				</div>

			</div>

			<div class="medium-4 columns">

				<?php get_sidebar(); ?>

			</div>

		</div>
	</div>

<?php
get_footer();
