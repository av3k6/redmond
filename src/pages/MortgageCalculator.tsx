
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import MortgageCalculator from "@/components/property/mortgage/MortgageCalculator";

const MortgageCalculatorPage = () => {
  const [propertyPrice, setPropertyPrice] = useState<number>(350000); // Default starting price

  return (
    <div className="container mx-auto px-4 py-12">
      <Helmet>
        <title>Mortgage Calculator | TransacZen Haven</title>
        <meta 
          name="description" 
          content="Calculate your mortgage payments, compare different scenarios, and analyze cash flow with our mortgage calculator."
        />
      </Helmet>

      <div className="mx-auto">
        <h1 className="text-4xl font-bold mb-6">Mortgage Calculator</h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-4xl">
          Plan your home purchase with our advanced mortgage calculator. 
          Customize your loan terms, compare different scenarios, and analyze potential cash flow.
        </p>
        
        <MortgageCalculator propertyPrice={propertyPrice} />
      </div>
    </div>
  );
};

export default MortgageCalculatorPage;
