import React, { useState } from 'react';
import { api } from './api';
import { Panel, Field, Button, Icon } from './ui';

export default function QuestionForm({ request, refresh }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  return <Panel title={<span className="approval-title"><Icon name="MessageSquare"/>Astra needs your input</span>}>
    <form onSubmit={async event => {
      event.preventDefault();
      setBusy(true);
      setError('');
      try {
        await api('/inputs/' + request.id, { answers: Object.fromEntries(new FormData(event.currentTarget)) });
        await refresh();
      } catch (error) { setError(error.message); }
      finally { setBusy(false); }
    }}>
      {(request.data.questions || []).map(question => <Field key={question.id} label={question.question}>
        {question.options?.length > 0 && <div className="hint">{question.options.map(option => <p key={option.label}><strong>{option.label}</strong>: {option.description}</p>)}</div>}
        <input name={question.id} type={question.isSecret ? 'password' : 'text'} autoComplete="off" required maxLength={10000} placeholder="Your answer" />
      </Field>)}
      {error && <p className="form-error" role="alert">{error}</p>}
      <Button primary type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send answer'}</Button>
    </form>
  </Panel>;
}
