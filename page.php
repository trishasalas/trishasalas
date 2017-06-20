<?php
/**
 * The template for displaying all pages.
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages
 * and that other 'pages' on your WordPress site may use a
 * different template.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package TrishaSalas
 */

get_header(); ?>
<?php
while ( have_posts() ) :
	the_post();
?>

	<header class="page-header">
		<h1 class="page-title">
			<?php the_title(); ?>
		</h1>
	</header>

<div class="row">

	<div class="medium-8 columns">

		<div id="primary" class="content-area">

			<main id="main" class="site-main" role="main">
	<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>

		<div class="entry-content">
			<?php
			the_content();
			?>

		</div><!-- .entry-content -->

		<footer class="entry-footer">
			<?php trishasalas_entry_footer(); ?>
		</footer>
	</article>

				<?php

				endwhile; ?>

			</main>

		</div>

	</div>

	<div class="medium-4 columns">

		<?php get_sidebar(); ?>

	</div>

</div>

<?php
get_footer();
