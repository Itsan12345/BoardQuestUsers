import {
  FlaskConical,
  Microscope,
  Database,
  Stethoscope,
  ShieldAlert,
  BookMarked,
  BookOpen,
} from 'lucide-react';

export const ICON_MAP: Record<string, any> = {
  FlaskConical: FlaskConical,
  Atom: FlaskConical,
  Microscope: Microscope,
  Database: Database,
  Syringe: Microscope,
  Stethoscope: Stethoscope,
  ShieldAlert: ShieldAlert,
  BookMarked: BookMarked,
  BookOpen: BookOpen,
  'Clinical Chemistry': FlaskConical,
  Hematology: Microscope,
  Microbiology: Database,
  'Immunology & Serology and Immunohematology': Stethoscope,
  'Clinical Microscopy & Parasitology': FlaskConical,
  'Histopathology & MT Laws': ShieldAlert,
  'Histopathology and Medtech Laws': ShieldAlert,
};

