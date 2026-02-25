import SignContractClient from './SignContractClient';

export const dynamicParams = false;

// Static export: returns a placeholder so the dynamic route builds.
// Real tokens resolve at runtime via the live platform's API.
export async function generateStaticParams() {
  return [{ token: '_' }];
}

export default function SignContractPage({ params }: { params: { token: string } }) {
  return <SignContractClient token={params.token} />;
}