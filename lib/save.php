<? 
header("Content-Type: application/json");

if (file_put_contents("../$_POST[path]", $_POST["file"])) {
	echo "{ \"success\": 1 }";
}
?>