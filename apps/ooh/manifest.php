<? header("Content-Type: application/json"); ?>
{"speed" : 10000, "root"  : "apps/ooh/models/",<?

$models = array_slice(scandir("./models"), 3);
$files = array();



foreach ($models as $model) {
	$files[$model] = array_slice(scandir("./models/$model"), 3);
}

echo "models: ".json_encode($models).",";
echo "files: ".json_encode($files);

?>}