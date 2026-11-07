import { FlaskConical, ShieldAlert } from 'lucide-react';
import { SUBJECT_METADATA } from '../constants';
import type { SubjectMetadata } from '../types';

export function getSubjectMeta(subjectName: string): SubjectMetadata {
  if (SUBJECT_METADATA[subjectName]) {
    return SUBJECT_METADATA[subjectName];
  }
  const lower = subjectName.toLowerCase();
  if (lower.includes('histopath') || lower.includes('medtech laws') || lower.includes('mt laws')) {
    return {
      name: subjectName,
      icon: ShieldAlert,
      color: "bg-accent",
      enemy: "Legal Beholder",
      imageUrl: "/images/Hispatho256.png",
      backgroundUrl: "/images/Hispatho256_bg.webp",
      difficulty: 3,
      biome: "The Citadel of Codes",
      description: "Where science meets the letter of the law. Preserve the ethics."
    };
  }
  if (lower.includes('microscopy') || lower.includes('parasito')) {
    return SUBJECT_METADATA["Clinical Microscopy & Parasitology"];
  }
  if (lower.includes('chem')) {
    return SUBJECT_METADATA["Clinical Chemistry"];
  }
  if (lower.includes('hema') && !lower.includes('immuno')) {
    return SUBJECT_METADATA["Hematology"];
  }
  if (lower.includes('microbio')) {
    return SUBJECT_METADATA["Microbiology"];
  }
  if (lower.includes('immuno') || lower.includes('serology')) {
    return SUBJECT_METADATA["Immunology & Serology and Immunohematology"];
  }

  return {
    name: subjectName,
    icon: FlaskConical,
    color: "bg-primary",
    enemy: "Exam Guardian",
    imageUrl: "/images/Hispatho256.png",
    backgroundUrl: "/images/Hispatho256_bg.webp",
    arenaBackgroundUrl: "/ui/background_clinicalchem.png",
    difficulty: 3,
    biome: "Laboratory Science Realm",
    description: `Master topics in ${subjectName} to prove your expertise.`
  };
}

export function isMajorSubject(subjectName: string): boolean {
  if (!subjectName) return false;
  if (SUBJECT_METADATA[subjectName]) {
    return true;
  }
  const lower = subjectName.toLowerCase();
  return (
    lower.includes('histopath') ||
    lower.includes('medtech laws') ||
    lower.includes('mt laws') ||
    lower.includes('microscopy') ||
    lower.includes('parasito') ||
    lower.includes('chem') ||
    (lower.includes('hema') && !lower.includes('immuno')) ||
    lower.includes('microbio') ||
    lower.includes('immuno') ||
    lower.includes('serology')
  );
}

