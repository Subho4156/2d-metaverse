import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MetaverseOffice from "./MetaverseWorld";
import SpaceStation from "./SpaceStation";
import { getSpaceById } from "../api";

const MetaverseRouter = () => {
  const { id } = useParams();
  const [space, setSpace] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const res = await getSpaceById(id);
      setSpace(res.data.space);
    };
    fetch();
  }, [id]);

  if (!space) return <div>Loading...</div>;

  if (space.mapKey === "spacestation") {
    return <SpaceStation />;
  }

  // default
  return <MetaverseOffice />;
};

export default MetaverseRouter;