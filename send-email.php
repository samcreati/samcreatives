<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $to = "sam.creatives2010@gmail.com";
    $subject = "New Lead from SAM Creatives Website";
    
    $name = $_POST['name'];
    $email = $_POST['email'];
    $phone = $_POST['phone'];
    $service = $_POST['service'];
    $message = $_POST['message'];
    
    $body = "
    <html>
    <body>
        <h2>🔔 New Lead Received!</h2>
        <p><strong>Name:</strong> $name</p>
        <p><strong>Email:</strong> $email</p>
        <p><strong>Phone:</strong> $phone</p>
        <p><strong>Service:</strong> $service</p>
        <p><strong>Message:</strong> $message</p>
        <hr>
        <p><small>Sent from SAM Creatives Website</small></p>
    </body>
    </html>
    ";
    
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: website@samcreatives.com" . "\r\n";
    
    if(mail($to, $subject, $body, $headers)) {
        echo json_encode(["status" => "success", "message" => "Email sent!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to send"]);
    }
}
?>