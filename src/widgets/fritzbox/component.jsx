import Container from "components/services/widget/container";
import Block from "components/services/widget/block";
import useWidgetAPI from "utils/proxy/use-widget-api";

export default function Component({ service }) {
  const { widget } = service;

  const { data: bandwidthData, error: bandwidthError } = useWidgetAPI(widget, "docker/containers/json", {
    all: 1,
  });

  if (bandwidthError) {
    return <Container service={service} error={bandwidthError} />;
  }

  if (!bandwidthData) {
    return (
      <Container service={service}>
        <Block label="fritzbox.upstreambitrate" />
        <Block label="fritzbox.downstreambitrate" />
        <Block label="fritzbox.up" />
      </Container>
    );
  }

  const upstreambitrate = bandwidthData.NewLayer1UpstreamMaxBitRate;
  const downstreambitrate = bandwidthData.NewLayer1UpstreamMaxBitRate ;
  const up = bandwidthData.NewPhysicalLinkStatus;


  return (
    <Container service={service}>
      <Block label="fritzbox.upstreambitrate" value={upstreambitrate} />
      <Block label="fritzbox.downstreambitrate" value={downstreambitrate} />
      <Block label="fritzbox.up" value={up} />
    </Container>
  );
}
