export default function ContactInfo() {
  return (
    <div className="bg-gray-100 py-16 px-10">
      <div className="grid md:grid-cols-3 gap-10 text-center">

        <div>
          <h3 className="font-bold text-lg">📍 Address</h3>
          <p>Berlin, Germany</p>
        </div>

        <div>
          <h3 className="font-bold text-lg">⏰ Opening Hours</h3>
          <p>Mon - Sun: 10:00 AM - 11:00 PM</p>
        </div>

        <div>
          <h3 className="font-bold text-lg">📞 Contact</h3>
          <p>+49 123 456 789</p>
        </div>

      </div>
    </div>
  );
}