<?php
/**
 * The template for displaying the footer.
 *
 * Contains the closing of the #content div and all content after.
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package TrishaSalas
 */
?>



			<footer id="colophon" class="site-footer" role="contentinfo">
				<div class="footer-widgets row">

						<?php dynamic_sidebar( 'footer' ); ?>


				</div>

				<div class="column row">

					<p class="text-center">
							<?php
							$coffee = file_get_contents( get_template_directory() . '/assets/dist/svg/icon-coffee-cup.svg' );
							?>
							<?php
							if ( ! empty( $coffee ) ) {
								echo $coffee;
							}
							?>
						&nbsp;Copyright © 2017 · Salas Studios LLC
					</p>

				</div><!-- .column.row -->

			</footer><!-- #colophon -->

<?php wp_footer(); ?>
</body>
</html>
