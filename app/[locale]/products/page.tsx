import CategoryTabs from "../components/products/categorytabs";

export async function getCategories() {
  const url = `${process.env.NEXT_PUBLIC_baseURL}/categories`; // ← keep your real URL here

  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();

  if (!res.ok || !res.headers.get("content-type")?.includes("json")) {
   console.error("getCategories failed:", res.status, text.slice(0, 1500));
    throw new Error(`Categories API returned ${res.status}`);
  }

  return JSON.parse(text);
}

export default async function Products() {

     const categories = await getCategories();
     

  return (
    <>

    <div className="products-page-wrapper">
        <div className="container mx-auto px-4">
             <CategoryTabs categories={categories} />
      
        {/* <div className="categories">
                <div className="category">  
                    <div className="category-image">
                        <img src="/images/pizza.jpeg" alt="Category 1" />
                    </div>
                    <div className="category-name">Pizza</div>

                </div>
                <div className="category">  
                    <div className="category-image">
                        <img src="/images/burger.jpeg" alt="Category 1" />
                    </div>
                    <div className="category-name">Burgers</div>

                </div>
                <div className="category">  
                    <div className="category-image">
                        <img src="/images/chineese.jpeg" alt="Category 1" />
                    </div>
                    <div className="category-name">Chineese</div>

                </div>
                <div className="category">  
                    <div className="category-image">
                        <img src="/images/italian.jpeg" alt="Category 1" />
                    </div>
                    <div className="category-name">Italian</div>

                </div>
        </div> */}

      
          </div>
    </div>
    
    </>
  )
}