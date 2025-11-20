import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordGeneratorProps {
  value: string;
  onChange: (password: string) => void;
}

const PasswordGenerator: React.FC<PasswordGeneratorProps> = ({ value, onChange }) => {
  const [length, setLength] = useState(12);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [strength, setStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState('');
  const [copied, setCopied] = useState(false);

  const calculateStrength = (password: string) => {
    let score = 0;
    
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/[0-9]/.test(password)) score += 10;
    if (/[^A-Za-z0-9]/.test(password)) score += 20;
    
    return Math.min(100, score);
  };

  const getStrengthLabel = (strength: number) => {
    if (strength < 30) return 'Fraca';
    if (strength < 60) return 'Média';
    if (strength < 80) return 'Boa';
    return 'Forte';
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 30) return 'bg-red-500';
    if (strength < 60) return 'bg-yellow-500';
    if (strength < 80) return 'bg-blue-500';
    return 'bg-green-500';
  };

  useEffect(() => {
    const newStrength = calculateStrength(value);
    setStrength(newStrength);
    setStrengthLabel(getStrengthLabel(newStrength));
  }, [value]);

  const generatePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let charset = '';
    if (includeLowercase) charset += lowercase;
    if (includeUppercase) charset += uppercase;
    if (includeNumbers) charset += numbers;
    if (includeSymbols) charset += symbols;

    if (charset === '') {
      toast.error('Selecione pelo menos um tipo de caractere!');
      return;
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    onChange(password);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Senha copiada para área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar senha!');
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">Senha Gerada</Label>
        <div className="flex gap-2">
          <Input
            id="password"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Senha será gerada aqui..."
            className="font-mono"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={copyToClipboard}
            disabled={!value}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={generatePassword}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {value && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Força da senha:</span>
            <span className="font-medium">{strengthLabel}</span>
          </div>
          <Progress value={strength} className="h-2" />
        </div>
      )}

      <Separator />

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="length">Comprimento: {length}</Label>
          <input
            id="length"
            type="range"
            min="8"
            max="32"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="uppercase"
              checked={includeUppercase}
              onCheckedChange={(checked) => setIncludeUppercase(checked as boolean)}
            />
            <Label htmlFor="uppercase">Letras maiúsculas (A-Z)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="lowercase"
              checked={includeLowercase}
              onCheckedChange={(checked) => setIncludeLowercase(checked as boolean)}
            />
            <Label htmlFor="lowercase">Letras minúsculas (a-z)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="numbers"
              checked={includeNumbers}
              onCheckedChange={(checked) => setIncludeNumbers(checked as boolean)}
            />
            <Label htmlFor="numbers">Números (0-9)</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="symbols"
              checked={includeSymbols}
              onCheckedChange={(checked) => setIncludeSymbols(checked as boolean)}
            />
            <Label htmlFor="symbols">Símbolos (!@#$%^&*)</Label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordGenerator;