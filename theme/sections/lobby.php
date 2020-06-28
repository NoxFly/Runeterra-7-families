<?php

if(!defined('NOX_SEVEN_FAMILIES')) exit("<h1>Forbidden</h1><p>You don't have permission to access to this part of the server.</p><hr>");

?>

<!-- Lobby -->
<section id='lobby'>
    <?php

    for($i=2; $i <= 5; $i++) {
        echo "<article id='player-banner-$i'>
            <div></div>
            <span></span>
        </article>";
    }

    ?>


    <article id='player-banner'>
        <div></div>
        <span></span>
    </article>


    
    <div class='cancel'></div>
    <div id='launch'>Lancer</div>
</section>