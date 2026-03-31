import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "components/ui/table";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Trash2 } from "lucide-react";
import { Advances } from "entities/all";

export default function ManageAdvancesDialog({ open, onClose, employee, theme }) {
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reason, setReason] = useState("");
  
  useEffect(() => {
    if (open && employee) {
      loadAdvances();
    }
  }, [open, employee]);

  const loadAdvances = async () => {
    setLoading(true);
    try {
      const data = await Advances.getByEmployee(employee.id);
      setAdvances(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!amount || isNaN(Number(amount)) || !date) {
      alert("Valid amount and date are required.");
      return;
    }
    try {
      await Advances.create(employee.id, { amount: Number(amount), date, reason });
      setAmount("");
      setReason("");
      loadAdvances();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (advId) => {
    if (!window.confirm("Delete this advance?")) return;
    try {
      await Advances.delete(employee.id, advId);
      loadAdvances();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700 sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="dark:text-white">Manage Advances for {employee?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 dark:bg-gray-900 dark:border-gray-700 space-y-4">
            <h4 className="font-semibold text-slate-700 dark:text-gray-200">Add New Advance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="dark:text-gray-300">Amount</Label>
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 1234" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-gray-300">Date (Month/Year Deduction)</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <Label className="dark:text-gray-300">Reason</Label>
                <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Optional" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            <Button onClick={handleAdd} className="w-full">Add Advance</Button>
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-xl dark:border-gray-700">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-gray-900 border-b-slate-200 dark:border-b-gray-700 hover:bg-slate-50 dark:hover:bg-gray-900">
                  <TableHead className="dark:text-gray-200">Date</TableHead>
                  <TableHead className="dark:text-gray-200">Amount</TableHead>
                  <TableHead className="dark:text-gray-200">Reason</TableHead>
                  <TableHead className="w-[80px] dark:text-gray-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="hover:bg-transparent"><TableCell colSpan={4} className="text-center dark:text-gray-400">Loading...</TableCell></TableRow>
                ) : advances.length === 0 ? (
                  <TableRow className="hover:bg-transparent"><TableCell colSpan={4} className="text-center text-slate-500 dark:text-gray-400">No advances found.</TableCell></TableRow>
                ) : (
                  advances.map(adv => (
                    <TableRow key={adv.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-gray-300">{adv.date}</TableCell>
                      <TableCell className="font-semibold dark:text-white">{adv.amount}</TableCell>
                      <TableCell className="dark:text-gray-300">{adv.reason || "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 dark:hover:bg-gray-700" onClick={() => handleDelete(adv.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
