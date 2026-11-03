import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Body, Field, PrimaryButton, Screen, Title } from '../../components/ui';
import { t } from '../../i18n';
import { useAppState } from '../../state/AppState';

export default function NameStep() {
  const { draft, updateDraft } = useAppState();
  const [name, setName] = useState(draft.displayName ?? '');
  const trimmed = name.trim();

  return (
    <Screen>
      <Title>{t('nameTitle')}</Title>
      <Body muted>{t('nameHint')}</Body>
      <Field
        value={name}
        onChangeText={setName}
        placeholder={t('namePlaceholder')}
        autoFocus
        maxLength={30}
        returnKeyType="next"
      />
      <View style={{ flex: 1 }} />
      <PrimaryButton
        label={t('next')}
        disabled={trimmed.length === 0}
        onPress={() => {
          updateDraft({ displayName: trimmed });
          router.push('/onboarding/birthdate');
        }}
      />
      <View style={{ height: 24 }} />
    </Screen>
  );
}
