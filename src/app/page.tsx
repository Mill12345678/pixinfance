import QuickAddForm from "../components/QuickAddForm";

export default function Home() {
  return (
    <div style={{ maxWidth: '640px' }}>
      <h1 className="card-title" style={{ fontSize: '1.6rem', marginBottom: '4px' }}>
        Nhập giao dịch nhanh
      </h1>
      <p className="card-sub">Ghi nhận thu/chi chỉ trong vài giây</p>
      <QuickAddForm />
    </div>
  );
}
