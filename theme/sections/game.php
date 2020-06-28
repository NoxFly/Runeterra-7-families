<?php

if(!defined('NOX_SEVEN_FAMILIES')) exit("<h1>Forbidden</h1><p>You don't have permission to access to this part of the server.</p><hr>");

?>

<!-- In game section -->
<section id='game'>

    <div id='deck'>
        <div class='inner'>
            <?php
            for($i=0; $i<5; $i++) {
                $z = ($i * 2) . 'px';
                echo "<div class='cards' style='transform: scale(.7) translate(-70%, -70%) rotateX(65deg) rotateZ(12deg) translateZ($z)'></div>";
            }
            ?>
        </div>
    </div>

    <div id='pannel-bundle'>
        <div class='inner'>
        <?php

        for($i=0; $i<7; $i++) {
            $a = ($i==3)? ' active' : '';
            echo "<div class='bundle bundle-$i$a'>";

            for($j=0; $j<6; $j++) {
                echo "<div class='card card-$j'>
                    <div class='inner'>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>";
            }

            echo "</div>";
        }

        ?>
        </div>
    </div>


    <div id='previous-bundle'></div>
    <div id='next-bundle'></div>
    <div id='close-bundle-phone'></div>

    <div id='pannel-participants'>
        <div id='arrow-round'></div>
    </div>

    <div id='timer'>
        <div></div>
    </div>

    <div id='regions-summary'></div>


    <div id='popup-region-summary'>
        <h3></h3>
        <div>
            <?php for($i=0; $i<6; $i++) echo "<span></span>"; ?>
        </div>
    </div>


    <!-- Message box for events -->

    <div id='message-center'>
        <div id='mcb'></div> <!-- message-center-before -->
        <div id='mca'></div> <!-- message-center-after -->
        <div class='inner'>
            <h2></h2>
        </div>
    </div>
    


    <div id='participants'></div>



    <div id='region-big-logo'></div>



    <article id='complete-family'>
        <div>
            <h2>Région complétée</h2>
            <p>Bien joué,<br>vous avez complété la région <span></span> !</p>
            <div>ok</div>
        </div>
        <span></span>
    </article>
    <div id='family-hover'></div>
    



    <div id='endofgame'>
        <div>
            <button>continuer</button>
        </div>
        <span></span>
    </div>

    <div id='radial-ingame-background'></div>

    <div id='stealMenu'>
        <h2>Qui souhaites-tu voler ?</h2>

        <div class='inner'></div>
    </div>


    <!-- <div id='hover'></div> - already present in header.php -->

</section>