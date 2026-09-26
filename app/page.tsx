import { Picker } from '@/components/Picker';
import { getCatalog } from '@/lib/catalog';
import { allowedFamilies, instanceName } from '@/lib/config';

export default function Home() {
  const { fonts, updated } = getCatalog();
  return (
    <Picker fonts={fonts} name={instanceName} restricted={!!allowedFamilies} updated={updated} />
  );
}
