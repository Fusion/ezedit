<?php
$o = '';

$c = file_get_contents('nicEdit.js');
$e = base64_encode($c);
$o .= <<<EOB
\t\t\$this->editor_code = <<<EOEC
$e
EOEC;

EOB;

$c = file_get_contents('nicEditorIcons.gif');
$e = base64_encode($c);
$o .= <<<EOB
\t\t\$this->toolbar_bin = <<<EOEC
$e
EOEC;

EOB;

$o .= <<<EOB
}}
EOB;

$f = fopen('rs.php', 'w');
fputs($f, $o);
fclose($f);
?>
