import { Picker } from '@/components/Picker';
import { getCatalog } from '@/lib/catalog';
import { allowedFamilies, embedOrigins, instanceName, showSpillcheckBadge } from '@/lib/config';

export default function Home() {
  const { fonts, updated } = getCatalog();
  return (
    <Picker
      fonts={fonts}
      name={instanceName}
      restricted={!!allowedFamilies}
      updated={updated}
      embedOrigins={embedOrigins}
      showBadge={showSpillcheckBadge}
    />
  );
}
