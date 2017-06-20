<?php
/**
 * Kickoff theme setup and build
 */

namespace TrishaSalas;

define( 'TRISHASALAS_VERSION', '2.0.0' );
define( 'TRISHASALAS_DIR', __DIR__ );
define( 'TRISHASALAS_URL', get_template_directory_uri() );


require_once __DIR__ . '/includes/custom-login.php';
require_once __DIR__ . '/includes/customizer.php';
require_once __DIR__ . '/includes/enqueue.php';
require_once __DIR__ . '/includes/extras.php';
require_once __DIR__ . '/includes/jetpack.php';
require_once __DIR__ . '/includes/setup.php';
require_once __DIR__ . '/includes/sidebars.php';
require_once __DIR__ . '/includes/template-tags.php';
