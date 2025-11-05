<?php
echo "PHP Error Reporting: " . ini_get('error_reporting') . "\n";
echo "Display Errors: " . ini_get('display_errors') . "\n";
echo "Log Errors: " . ini_get('log_errors') . "\n";
echo "Error Log: " . ini_get('error_log') . "\n";
echo "Output Buffering: " . ini_get('output_buffering') . "\n";

phpinfo();
?>
