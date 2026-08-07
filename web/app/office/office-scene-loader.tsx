"use client";

import dynamic from "next/dynamic";

const OfficeScene3D = dynamic(() => import("./office-scene-3d"), {
  ssr: false,
  loading: () => <div className="office-wrap" />,
});

export default function OfficeSceneLoader() {
  return <OfficeScene3D />;
}
