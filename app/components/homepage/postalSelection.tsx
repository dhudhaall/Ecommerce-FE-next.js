export default function PostalSelection() {
  return (
    <div className="bg-[#f5efe6] min-h-[80vh] flex items-center px-10">
      <div className="grid md:grid-cols-2 gap-10 items-center w-full">

        {/* LEFT IMAGES */}
        <div className="relative hidden md:block">
          <img
            src="/food1.png"
            className="absolute top-10 left-10 w-40 rounded-full shadow-lg"
          />
          <img
            src="/food2.png"
            className="absolute bottom-10 left-40 w-40 rounded-full shadow-lg"
          />
          <img
            src="/food3.png"
            className="absolute top-40 left-60 w-40 rounded-full shadow-lg"
          />
        </div>

        {/* RIGHT CONTENT */}
        <div>
          <h1 className="text-5xl font-bold text-orange-600 mb-4">
            Craving Something?
          </h1>

          <p className="text-gray-600 mb-6">
            Let’s get you started!
          </p>

          <div className="flex gap-4">
            <select className="border px-4 py-3 rounded-full w-64">
              <option>Select your location</option>
              <option>Berlin</option>
              <option>Munich</option>
            </select>

            <button className="bg-orange-500 text-white px-6 py-3 rounded-full">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}