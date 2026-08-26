import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Repairer } from '../types';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
};

export type MainTabParamList = {
  Accueil: undefined;
  Diagnostic: undefined;
  Ajouter: undefined;
  Rendez_vous: undefined;
  Profil: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Repairers: {
    deviceName: string;
    deviceModel: string;
    issueLabel: string;
    priceRange: string;
    urgency: string;
  };
  Booking: {
    repairer: Repairer;
    diagnosis: {
      deviceName: string;
      deviceModel: string;
      issueLabel: string;
      priceRange: string;
      urgency: string;
    };
  };
  AppointmentDetail: { appointmentId: string };
  AddDevice: undefined;
  DeviceDetail: { deviceId: string };
  QRCodeModal: { deviceId: string; name: string; serialNumber?: string };
  Certificate: { repairId: string };
  EditDevice: { deviceId: string };
  TransferOwnership: { deviceId: string };
};
