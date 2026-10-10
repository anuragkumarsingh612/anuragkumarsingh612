import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Download,
  RotateCcw,
  ShieldCheck,
  Trash2,
  ImageOff,
  Users,
  LogIn,
} from "lucide-react";
import { useDemo } from "../../app/context";
import { initialState } from "../../app/demo";
import { copy as c } from "../../lib/i18n";
import { csvCell } from "../../lib/format";
import { Button, Card, PageHeading, Sheet } from "../../components/ui";
import { HouseholdForm } from "../household/Household";
import { InstallPrompt } from "./InstallPrompt";
export default function Settings() {
  const { state, setState, notify } = useDemo();
  const [remove, setRemove] = useState(false);
  const [edit, setEdit] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  function exportCsv() {
    const rows = [
      ["date", "product", "store", "quantity", "price_inr", "source"],
      ...state.purchases.map((p) => [
        p.date,
        p.name,
        p.store,
        p.quantity,
        p.price,
        p.source,
      ]),
    ];
    const blob = new Blob(
      ["\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "demo-purchases.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(c.settings.exported);
  }
  return (
    <div className="page">
      <PageHeading title={c.settings.title} subtitle={c.settings.subtitle} />
      <div className="demo-notice">
        <span className="eyebrow">{c.settings.phase}</span>
        <p>{c.settings.phaseCopy}</p>
      </div>
      <h2 className="subheading">{c.settings.account}</h2>
      <Card className="settings-links">
        <Link to="/welcome">
          <LogIn size={19} />
          <span>{c.settings.welcome}</span>
          <ChevronRight size={17} />
        </Link>
        <button onClick={() => setEdit(true)}>
          <Users size={19} />
          <span>{c.settings.editHousehold}</span>
          <ChevronRight size={17} />
        </button>
      </Card>
      <h2 className="subheading">{c.settings.data}</h2>
      <Card className="settings-links">
        <button onClick={exportCsv}>
          <Download size={19} />
          <span>{c.settings.export}</span>
          <ChevronRight size={17} />
        </button>
        <button
          onClick={() => {
            setState(initialState());
            notify(c.common.resetDone);
          }}
        >
          <RotateCcw size={19} />
          <span>{c.common.reset}</span>
          <ChevronRight size={17} />
        </button>
        <button className="danger-text" onClick={() => setRemove(true)}>
          <Trash2 size={19} />
          <span>{c.settings.delete}</span>
          <ChevronRight size={17} />
        </button>
      </Card>
      <div className="privacy-info">
        <ImageOff size={22} />
        <div>
          <h2>{c.settings.noPhotos}</h2>
          <p>{c.settings.noPhotosCopy}</p>
        </div>
      </div>
      <div className="privacy-info">
        <ShieldCheck size={22} />
        <div>
          <h2>{c.settings.privacy}</h2>
          <p>{c.settings.privacyCopy}</p>
        </div>
      </div>
      <InstallPrompt />
      <p className="page-footnote">{c.settings.version}</p>
      {remove && (
        <Sheet
          title={c.settings.deleteTitle}
          onClose={() => {
            setRemove(false);
            setConfirmation("");
          }}
        >
          <p>{c.settings.deleteCopy}</p>
          <label>
            {c.settings.deleteLabel}
            <input
              autoComplete="off"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </label>
          <Button
            variant="danger"
            disabled={confirmation !== "DELETE"}
            onClick={() => {
              setState({
                version: 1,
                household: state.household,
                products: [],
                purchases: [],
                list: [],
                savedOnce: false,
              });
              setRemove(false);
              setConfirmation("");
              notify(c.settings.deleted);
            }}
          >
            {c.settings.deleteConfirm}
          </Button>
        </Sheet>
      )}
      {edit && (
        <Sheet title={c.household.create} onClose={() => setEdit(false)}>
          <HouseholdForm onComplete={() => setEdit(false)} />
        </Sheet>
      )}
    </div>
  );
}
