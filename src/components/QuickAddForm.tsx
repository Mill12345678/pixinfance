'use client';

import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, UploadCloud, X } from 'lucide-react';

type TransactionType = 'income' | 'expense';
type Niche = 'ai' | 'stem' | 'chung';
type SourceAccount = 'company_bank' | 'personal_bank' | 'cash';

type Student = { id: string; name: string; parent_phone: string | null; parent_name: string | null };

export default function QuickAddForm() {
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [niche, setNiche] = useState<Niche>('chung');
  const [sourceAccount, setSourceAccount] = useState<SourceAccount>('personal_bank');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [contractId, setContractId] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSearching, setStudentSearching] = useState(false);

  const showStemStudentLookup = transactionType === 'income' && niche === 'stem';
  const showContractId = niche === 'ai';

  const searchStudents = async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setStudents([]);
      return;
    }
    setStudentSearching(true);
    try {
      const res = await fetch(`/api/students?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } finally {
      setStudentSearching(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  async function uploadProof(): Promise<string | null> {
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Upload failed');
    }
    const data = await res.json();
    return data.webViewLink as string;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);

    const amountNum = parseInt(amount.replace(/\./g, ''), 10);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setMessage({ type: 'error', text: 'Vui lòng nhập số tiền hợp lệ (> 0).' });
      setSubmitting(false);
      return;
    }

    try {
      if (showStemStudentLookup && !selectedStudent) {
        throw new Error('Bắt buộc chọn học sinh có sẵn trong DB khi thu STEM (PRD v2 US11).');
      }

      const documentUrl = await uploadProof();
      const body = {
        transaction_date: new Date().toISOString().slice(0, 10),
        transaction_type: transactionType,
        niche,
        source_account: sourceAccount,
        actual_amount: amountNum,
        notes: notes || description || null,
        category: selectedStudent
          ? `Học phí — ${selectedStudent.name}`
          : null,
        contract_id: contractId || null,
        document_url: documentUrl,
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? 'Save failed');
      }

      setMessage({ type: 'success', text: 'Đã lưu giao dịch thành công.' });
      setAmount('');
      setDescription('');
      setNotes('');
      setFile(null);
      setContractId('');
      setSelectedStudent(null);
      setStudentQuery('');
      setStudents([]);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Đã có lỗi xảy ra.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <div className="type-switch" role="group" aria-label="Transaction type">
        <button
          type="button"
          className={`type-btn ${transactionType === 'expense' ? 'active danger' : ''}`}
          onClick={() => setTransactionType('expense')}
        >
          <ArrowDownCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          CHI
        </button>
        <button
          type="button"
          className={`type-btn ${transactionType === 'income' ? 'active success' : ''}`}
          onClick={() => setTransactionType('income')}
        >
          <ArrowUpCircle size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
          THU
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="flex-row">
          <div className="flex-1">
            <label>Business Niche</label>
            <select className="input-field" value={niche} onChange={(e) => setNiche(e.target.value as Niche)}>
              <option value="ai">AI Solutions (B2B)</option>
              <option value="stem">STEM Education</option>
              <option value="chung">General Ops</option>
            </select>
          </div>
          <div className="flex-1">
            <label>Source Account (Nguồn tiền)</label>
            <select
              className="input-field"
              value={sourceAccount}
              onChange={(e) => setSourceAccount(e.target.value as SourceAccount)}
            >
              <option value="personal_bank">Personal Bank (Cá nhân)</option>
              <option value="company_bank">Company Bank (Pháp nhân)</option>
              <option value="cash">Petty Cash (Tiền mặt)</option>
            </select>
          </div>
        </div>

        {showContractId && (
          <div>
            <label>Mã Hợp Đồng (Contract ID) — AI</label>
            <input
              type="text"
              className="input-field"
              placeholder="VD: AI-2026-01"
              value={contractId}
              onChange={(e) => setContractId(e.target.value)}
            />
          </div>
        )}

        {showStemStudentLookup && (
          <div>
            <label>Tên Học Sinh (bắt buộc chọn từ DB)</label>
            {selectedStudent ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 14px' }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{selectedStudent.name}</span>
                  {selectedStudent.parent_phone && (
                    <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontSize: '0.85rem' }}>
                      ☎ {selectedStudent.parent_phone}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentQuery('');
                    setStudents([]);
                  }}
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Gõ tên để tìm…"
                  value={studentQuery}
                  onChange={(e) => {
                    setStudentQuery(e.target.value);
                    void searchStudents(e.target.value);
                  }}
                />
                {studentSearching && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px' }}>Đang tìm…</p>
                )}
                {students.length > 0 && (
                  <div className="suggest-list">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="suggest-item"
                        onClick={() => {
                          setSelectedStudent(s);
                          setStudents([]);
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                        {s.parent_phone && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>☎ {s.parent_phone}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="flex-row">
          <div className="flex-1">
            <label>Amount (VND)</label>
            <input
              type="text"
              inputMode="numeric"
              className="input-field"
              placeholder="e.g. 1280750"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label>Description (Nội dung)</label>
            <input
              type="text"
              className="input-field"
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label>Note (Ghi chú)</label>
          <input
            type="text"
            className="input-field"
            placeholder="Optional"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div
          className={`upload-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓ {file.name}</p>
          ) : (
            <>
              <UploadCloud size={28} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p>Drag &amp; drop invoice image here, or click below</p>
              <input
                type="file"
                style={{ display: 'none' }}
                id="file-upload"
                onChange={handleFileChange}
                accept="image/*,.pdf"
              />
              <label htmlFor="file-upload" className="btn-secondary" style={{ cursor: 'pointer' }}>
                Choose File
              </label>
            </>
          )}
        </div>

        {message && (
          <p style={{ color: message.type === 'success' ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>
            {message.text}
          </p>
        )}

        <button type="submit" className="btn mt-4" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save Transaction'}
        </button>
      </form>
    </div>
  );
}
