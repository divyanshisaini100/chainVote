import { lazy, Suspense, useEffect, useState } from "react";
import "./App.css";
import { connectWallet, getReadContract, getWriteContract } from "./contract";

const ChainScene = lazy(() => import("./ChainScene"));

export default function App() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Create-poll form state
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [minutes, setMinutes] = useState(60);

  // Load all polls from chain
  async function loadPolls() {
    try {
      const contract = await getReadContract();
      const count = await contract.pollCount();
      const n = Number(count);
      const loaded = [];

      for (let i = 0; i < n; i++) {
        const p = await contract.polls(i);
        const opts = await contract.getOptions(i);
        const results = await contract.getResults(i);
        loaded.push({
          id: i,
          question: p.question,
          options: opts.map((o, idx) => ({ label: o, votes: Number(results[idx]) })),
          deadline: Number(p.deadline),
          creator: p.creator,
        });
      }
      setPolls(loaded);
    } catch (err) {
      console.error(err);
      setMessage("Failed to load polls: " + (err.shortMessage || err.message));
    }
  }

  useEffect(() => {
    loadPolls();
  }, []);

  async function handleConnect() {
    try {
      setMessage("");
      const { signer, address } = await connectWallet();
      setSigner(signer);
      setAccount(address);
    } catch (err) {
      setMessage(err.message);
    }
  }
  
  async function handleCreate() {
    if (!signer) return setMessage("Connect wallet first.");
    const cleanOptions = options.filter((o) => o.trim() !== "");
    if (!question.trim()) return setMessage("Question required.");
    if (cleanOptions.length < 2) return setMessage("Need at least 2 options.");

    try {
      setLoading(true);
      setMessage("Confirm in MetaMask...");
      const contract = await getWriteContract(signer);
      const tx = await contract.createPoll(question.trim(), cleanOptions, minutes);
      setMessage("Waiting for confirmation...");
      await tx.wait();
      setMessage("Poll created ✅");
      setQuestion("");
      setOptions(["", ""]);
      setMinutes(60);
      await loadPolls();
    } catch (err) {
      setMessage("Create failed: " + (err.shortMessage || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleVote(pollId, optionIndex) {
    if (!signer) return setMessage("Connect wallet first.");
    try {
      setLoading(true);
      setMessage("Confirm vote in MetaMask...");
      const contract = await getWriteContract(signer);
      const tx = await contract.vote(pollId, optionIndex);
      await tx.wait();
      setMessage("Vote recorded ✅");
      await loadPolls();
    } catch (err) {
      setMessage("Vote failed: " + (err.shortMessage || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleAudit(pollId) {
    try {
      const contract = await getReadContract();
      const events = await contract.queryFilter(contract.filters.Voted(pollId));
      const tally = {};
      events.forEach((e) => {
        const idx = Number(e.args.optionIndex);
        tally[idx] = (tally[idx] || 0) + 1;
      });

      const onChain = await contract.getResults(pollId);
      const displayed = polls.find((p) => p.id === pollId);
      let match = true;
      onChain.forEach((v, i) => {
        if (Number(v) !== (tally[i] || 0)) match = false;
        if (displayed && displayed.options[i].votes !== Number(v)) match = false;
      });

      setMessage(
        match
          ? `✅ Audit passed for poll #${pollId}: event tally matches on-chain state.`
          : `❌ Mismatch detected for poll #${pollId}.`
      );
    } catch (err) {
      setMessage("Audit failed: " + (err.shortMessage || err.message));
    }
  }

  const shorten = (a) => (a ? a.slice(0, 6) + "..." + a.slice(-4) : "");

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="grid-floor" aria-hidden="true" />

      <nav className="topbar">
        <a className="brand" href="#top" aria-label="ChainVote home">
          <span className="brand-mark"><span /><span /><span /></span>
          <span>Chain<span className="brand-accent">Vote</span></span>
        </a>
        <div className="topbar-right">
          <span className="network-pill"><span className="status-dot" /> ON-CHAIN VOTING</span>
          {account ? (
            <div className="wallet connected-wallet"><span className="wallet-icon">◈</span> {shorten(account)}</div>
          ) : (
            <button className="btn primary connect-btn" onClick={handleConnect}>
              <span className="button-orbit">↗</span> Connect Wallet
            </button>
          )}
        </div>
      </nav>


      <main id="top" className="main-content">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span /> TRANSPARENT BY DESIGN</div>
            <h1>Make your vote<br /> <span>count on-chain.</span></h1>
            <p className="hero-subtitle">
              Community decisions, without the guesswork. Create a poll, cast your vote,
              and verify the results directly on the blockchain.
            </p>
            <div className="hero-actions">
              <a href="#create-poll" className="btn primary hero-cta">Create a poll <span>↗</span></a>
              <div className="trust-note"><span className="shield-icon">✓</span><span>Publicly verifiable<br /><b>Every vote leaves a trail</b></span></div>
            </div>
            <div className="hero-stats">
              <div><strong>{polls.length.toString().padStart(2, "0")}</strong><span>Polls on-chain</span></div>
              <i />
              <div><strong>{polls.reduce((sum, p) => sum + p.options.reduce((s, o) => s + o.votes, 0), 0).toString().padStart(2, "0")}</strong><span>Votes recorded</span></div>
              <i />
              <div><strong>100%</strong><span>Auditable</span></div>
            </div>
          </div>

          <div className="hero-visual" role="img" aria-label="Animated ChainVote network with separate explanations for creating polls, voting, and checking results">
            <Suspense fallback={<div className="three-scene" />}>
              <ChainScene />
            </Suspense>
            <div className="feature-callouts" aria-label="How voting works">
              <div className="floating-chip feature-callout callout-create"><span>⌕</span><b>Audit votes, not just trust.</b></div>
              <div className="floating-chip feature-callout callout-vote"><span>✓</span><b>One wallet, one vote.</b></div>
              <div className="floating-chip feature-callout callout-results"><span>∑</span><b>No middleman. Just math.</b></div>
            </div>
          </div>
        </section>
                {message && (
          <div className="message" role="status">
            <span className="message-icon">✦</span>
            <span>{message}</span>
            <button className="message-close" onClick={() => setMessage("")} aria-label="Dismiss message">×</button>
          </div>
        )}

        <section className="workspace">
          <section className="card create-card" id="create-poll">
            <div className="section-heading">
              <div className="section-icon create-icon">＋</div>
              <div><span className="section-kicker">START A CONVERSATION</span><h2>Create a poll</h2></div>
              <span className="step-number">01</span>
            </div>
            <p className="card-description">Put a question to your community. The results stay transparent and verifiable.</p>

            <label className="field-label" htmlFor="poll-question">YOUR QUESTION</label>
            <input
              id="poll-question"
              className="input"
              placeholder="e.g. What should we build next?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />

            <div className="options-label-row"><label className="field-label">VOTING OPTIONS</label><span>{options.length} options</span></div>
            <div className="form-options">
              {options.map((opt, i) => (
                <div className="option-input-wrap" key={i}>
                  <span className="option-index">{String(i + 1).padStart(2, "0")}</span>
                  <input
                    className="input"
                    placeholder={`Enter option ${i + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const copy = [...options];
                      copy[i] = e.target.value;
                      setOptions(copy);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="form-footer">
              <button className="btn ghost add-option" onClick={() => setOptions([...options, ""])}>
                <span>＋</span> Add option
              </button>
              <label className="dur">
                <span className="field-label">DURATION</span>
                <span className="duration-control">
                  <input
                    type="number"
                    className="input small"
                    value={minutes}
                    min={1}
                    onChange={(e) => setMinutes(Number(e.target.value))}
                  />
                  <span>min</span>
                </span>
              </label>
            </div>
            <button className="btn primary create-submit" onClick={handleCreate} disabled={loading}>
              <span>{loading ? "Processing..." : "Deploy poll"}</span><span className="submit-arrow">↗</span>
            </button>
            <p className="gas-note"><span>◇</span> Your wallet will ask you to confirm the transaction.</p>
          </section>

          <section className="polls-section">
            <div className="polls-title-row">
              <div><span className="section-kicker">THE COMMUNITY DECIDES</span><h2>Live polls <span className="live-dot" /></h2></div>
              <div className="poll-count"><span>{polls.length.toString().padStart(2, "0")}</span> TOTAL</div>
            </div>
            {polls.length === 0 && (
              <div className="empty-state">
                <div className="empty-cube"><span>◇</span></div>
                <h3>No polls in this block yet</h3>
                <p>Be the first to bring a question to the chain.</p>
                <a href="#create-poll" className="empty-link">Create the first poll <span>↗</span></a>
              </div>
            )}
            <div className="poll-list">
              {polls.map((p) => {
                const ended = Date.now() / 1000 > p.deadline;
                const total = p.options.reduce((s, o) => s + o.votes, 0);
                return (
                  <div className="card poll" key={p.id}>
                    <div className="poll-card-top">
                      <div className="poll-id"><span className="mini-chain">◇</span> POLL #{String(p.id).padStart(3, "0")}</div>
                      <span className={`tag ${ended ? "closed" : "open"}`}><span />{ended ? "Closed" : "Voting live"}</span>
                    </div>
                    <div className="poll-head"><h3>{p.question}</h3><span className="poll-total">{total} <small>votes</small></span></div>
                    <div className="poll-meta"><span>◷ {ended ? "Voting ended" : "Voting is open"}</span><span>Ends {new Date(p.deadline * 1000).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span></div>
                    <div className="poll-options">
                      {p.options.map((o, idx) => {
                        const pct = total > 0 ? Math.round((o.votes / total) * 100) : 0;
                        return (
                          <div className="option" key={idx}>
                            <div className="option-top">
                              <button
                                className="btn vote"
                                disabled={ended || loading}
                                onClick={() => handleVote(p.id, idx)}
                              >
                                <span className="vote-radio" />{o.label}<span className="vote-action">Vote ↗</span>
                              </button>
                              <span className="count">{o.votes} <small>· {pct}%</small></span>
                            </div>
                            <div className="bar"><div className="fill" style={{ width: pct + "%" }} /></div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="poll-card-footer">
                      <span className="chain-proof"><span>◈</span> Results stored on-chain</span>
                      <button className="btn ghost audit-btn" onClick={() => handleAudit(p.id)}><span>⌕</span> Audit results</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </section>

        <footer className="footer">
          <a className="brand footer-brand" href="#top"><span className="brand-mark"><span /><span /><span /></span><span>Chain<span className="brand-accent">Vote</span></span></a>
          <span>Built for communities that believe in transparent decisions.</span>
          <span className="footer-status"><span className="status-dot" /> BLOCKCHAIN-POWERED</span>
        </footer>
      </main>
    </div>
  );
}
