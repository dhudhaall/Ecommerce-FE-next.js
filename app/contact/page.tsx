export default function About() {
  return (
    <div className="contact-container">
  <h1 className="contact-title">Contact Us</h1>

  <div className="contact-grid">
    

    <div className="contact-info">

      <h2>Our Information</h2>

      <p><strong>Address:</strong> 123 Main Street</p>
      <p><strong>Postal Code:</strong> 10115</p>
      <p><strong>City:</strong> Berlin</p>

      <p><strong>Phone:</strong> +49 123 456789</p>
      <p><strong>Email:</strong> info@restaurant.com</p>


      <div className="opening-hours">
        <h3>Opening Hours</h3>

        <p>Monday: 10:00 AM - 10:00 PM</p>
        <p>Tuesday: 10:00 AM - 10:00 PM</p>
        <p>Wednesday: 10:00 AM - 10:00 PM</p>
        <p>Thursday: 10:00 AM - 11:00 PM</p>
        <p>Friday: 10:00 AM - 11:30 PM</p>
        <p>Saturday: 12:00 PM - 11:30 PM</p>
        <p>Sunday: Closed</p>
      </div>

    </div>

  
    <div className="contact-map">
      <iframe
        src="https://www.google.com/maps?q=Berlin&output=embed"
        width="100%"
        height="350"
        style={{border:0}}
        allowFullScreen
        loading="lazy"
      ></iframe>
    </div>

  </div>
</div>
  )

}