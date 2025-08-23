import React from "react";
const JsonLd: React.FC<{data: object}> = ({ data }) => (
  <script type="application/ld+json">{JSON.stringify(data)}</script>
);
export default JsonLd;
