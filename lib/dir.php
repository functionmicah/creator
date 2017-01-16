<?
function get_dir($value='')
{
	return json_encode(array_slice(scandir("../$value"), 3));
}

echo get_dir($_GET["path"]);
?>