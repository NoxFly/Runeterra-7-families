<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1 maximum-scale=1">

        <title>Jeu des 7 familles - LoL</title>

        <link rel='stylesheet' type='text/css' href='theme/css/style.css'>

        <script src='theme/js/libs/jquery.min.js'></script>
        <script src='theme/js/libs/prefixfree.min.js'></script>

        <script src="https://www.gstatic.com/firebasejs/7.14.0/firebase.js"></script>
    </head>

    <body>

        <?php

        $sectionPath = __DIR__ . '/theme/sections';

        require "$sectionPath/header.php";

        require "$sectionPath/connexion.php";

        require "$sectionPath/home.php";

        require "$sectionPath/research.php";

        require "$sectionPath/lobby.php";

        require "$sectionPath/game.php";

        ?>



        <script src='theme/js/script.js' type='module'></script>
    </body>
</html>