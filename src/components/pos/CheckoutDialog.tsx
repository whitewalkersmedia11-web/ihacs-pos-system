import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Banknote, CreditCard, Smartphone } from "lucide-react";
import { useState } from "react";

interface CheckoutDialogProps {
  open: boolean;
  total: number;
  onClose: () => void;
  onComplete: (method: string) => void;
}

const paymentMethods = [
  { id: "cash", label: "Cash", icon: Banknote },
  { id: "card", label: "Card", icon: CreditCard },
  { id: "mobile", label: "Mobile Pay", icon: Smartphone },
];

const CheckoutDialog = ({ open, total, onClose, onComplete }: CheckoutDialogProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handlePay = () => {
    if (!selected) return;
    setDone(true);
    setTimeout(() => {
      onComplete(selected);
      setDone(false);
      setSelected(null);
    }, 1500);
  };

  const handleClose = () => {
    setDone(false);
    setSelected(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {done ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <CheckCircle className="w-16 h-16 text-success animate-in zoom-in duration-300" />
            <p className="text-xl font-bold text-foreground">Payment Complete!</p>
            <p className="text-muted-foreground text-sm">Transaction recorded successfully</p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                Charge <span className="text-primary">${total.toFixed(2)}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground text-center">Select payment method</p>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelected(method.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      selected === method.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <method.icon className={`w-7 h-7 ${selected === method.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-sm font-medium">{method.label}</span>
                  </button>
                ))}
              </div>
              <Button
                onClick={handlePay}
                disabled={!selected}
                className="w-full h-12 text-base font-semibold"
              >
                Confirm Payment
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutDialog;
