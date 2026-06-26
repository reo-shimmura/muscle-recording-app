import type { AlertMessage as AlertMessageType } from '../types';

interface Props {
  message: AlertMessageType;
}

export default function AlertMessage({ message }: Props) {
  return (
    <div className={`alert alert-${message.type}`}>
      <span>{message.text}</span>
    </div>
  );
}
