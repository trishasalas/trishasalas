<?php
/**
 * Kickoff theme setup and build
 */

namespace TrishaSalas;

define( 'TRISHASALAS_VERSION', '2.0.0' );
define( 'TRISHASALAS_DIR', __DIR__ );
define( 'TRISHASALAS_URL', get_template_directory_uri() );

require_once __DIR__ . '/vendor/aaronholbrook/autoload/autoload.php';

\AaronHolbrook\Autoload\autoload( __DIR__ . '/includes' );
