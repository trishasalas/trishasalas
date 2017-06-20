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

	<div class="medium-8 columns">

		<div id="primary" class="content-area">

			<main id="main" class="site-main" role="main">
				<?php
				if ( have_posts() ) : ?>

					<?php
					while ( have_posts() ) :

						the_post();

						get_template_part( 'template-parts/content', get_post_format() );

					endwhile;

					the_posts_navigation();

				else :

					get_template_part( 'template-parts/content', 'none' );

				endif; ?>

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
