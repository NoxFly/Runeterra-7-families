<?php

define('NOX_SEVEN_FAMILIES', TRUE);

$sectionPath = __DIR__ . '/theme/sections';

$pages = ['connection', 'home', 'lobby', 'research', 'game'];

$defaultPage = 'connection';

$page = $defaultPage;


if(isset($_POST['section']) && in_array($_POST['section'], $pages)) {
    $page = $_POST['section'];
}



?>

<html>
    <head>
        <!-- META -->
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1 maximum-scale=1">

        <!-- TITLE -->
        <title>Jeu des 7 familles - LoL</title>

        <!-- CSS -->
        <link rel='stylesheet' type='text/css' href='theme/css/style.css'>

        <!-- JS LIBRARIES (JQUERY & PREFIXFREE) -->
        <script src='theme/js/libs/jquery.min.js'></script>
        <script src='theme/js/libs/prefixfree.min.js'></script>

        <!-- FIREBASE -->
        <script src="https://www.gstatic.com/firebasejs/7.14.0/firebase.js"></script>

        <!-- DEFAULT SCRIPT -->
        <script src='theme/js/script.js' type='module'></script>
    </head>

    <body>

        <?php require "$sectionPath/header.php"; ?>

        <div id='content'>
            <?php require "$sectionPath/$page.php"; ?>
        </div>

    </body>
</html>