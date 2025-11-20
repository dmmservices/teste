import React, { useState, useEffect } from 'react';
import { Copy, Check, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as OTPAuth from 'otpauth';

interface TOTPDisplayProps {
  secret: string;
  issuer?: string;
  label?: string;
}

const TOTPDisplay: React.FC<TOTPDisplayProps> = ({ secret, issuer = 'DMM', label = 'Account' }) => {
  const [token, setToken] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!secret) return;

    const generateToken = () => {
      try {
        const totp = new OTPAuth.TOTP({
          issuer,
          label,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: OTPAuth.Secret.fromBase32(secret),
        });

        const newToken = totp.generate();
        setToken(newToken);

        // Calculate time remaining in current 30-second window
        const now = Math.floor(Date.now() / 1000);
        const remaining = 30 - (now % 30);
        setTimeRemaining(remaining);
      } catch (error) {
        console.error('Error generating TOTP:', error);
        setToken('ERRO');
      }
    };

    // Generate token immediately
    generateToken();

    // Update every second
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setTimeRemaining(remaining);

      // Regenerate token when time expires
      if (remaining === 30) {
        generateToken();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [secret, issuer, label]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Código 2FA copiado!');
    } catch (error) {
      toast.error('Erro ao copiar código!');
    }
  };

  // Format token with space in middle (123 456)
  const formattedToken = token ? `${token.slice(0, 3)} ${token.slice(3)}` : '--- ---';

  // Calculate progress percentage
  const progressPercentage = (timeRemaining / 30) * 100;

  return (
    <div>
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Shield className="h-4 w-4" />
        Código 2FA (TOTP)
      </label>
      <div className="flex items-center gap-2 mt-1">
        <div className="relative flex-1">
          <Input
            value={formattedToken}
            readOnly
            className="font-mono text-center text-lg font-bold tracking-wider"
          />
          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full rounded-b overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-mono w-6 text-right">{timeRemaining}s</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopy}
          disabled={!token || token === 'ERRO'}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        O código é renovado automaticamente a cada 30 segundos
      </p>
    </div>
  );
};

export default TOTPDisplay;
