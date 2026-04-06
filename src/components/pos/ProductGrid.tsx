import { Product } from "@/data/products";

interface ProductGridProps {
  products: Product[];
  onAdd: (product: Product) => void;
}

const ProductGrid = ({ products, onAdd }: ProductGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onAdd(product)}
          className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:shadow-lg hover:border-primary/40 transition-all active:scale-95 touch-manipulation"
        >
          <span className="text-3xl">{product.emoji}</span>
          <span className="text-sm font-medium text-foreground text-center leading-tight">
            {product.name}
          </span>
          <span className="text-sm font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ProductGrid;
