package cmd

import (
	"encoding/json"
	"testing"

	"github.com/nexoral/axiodb-cli/pkg/commands"
)

func TestVectorSearchOptionsPayload(t *testing.T) {
	minScore := 0.85
	opts := commands.VectorSearchOptions{
		Field:    "embedding",
		Vector:   []float64{0.1, 0.2, 0.3},
		TopK:     3,
		MinScore: &minScore,
		Metric:   "cosine",
		Query:    map[string]interface{}{"type": "semantic"},
	}

	if opts.Field != "embedding" {
		t.Fatalf("expected field 'embedding', got %s", opts.Field)
	}
	if len(opts.Vector) != 3 {
		t.Fatalf("expected vector len 3, got %d", len(opts.Vector))
	}
	if opts.TopK != 3 {
		t.Fatalf("expected TopK 3, got %d", opts.TopK)
	}
	if opts.MinScore == nil || *opts.MinScore != 0.85 {
		t.Fatalf("expected minScore 0.85, got %v", opts.MinScore)
	}
	if opts.Metric != "cosine" {
		t.Fatalf("expected metric cosine, got %s", opts.Metric)
	}

	bytes, err := json.Marshal(opts.Vector)
	if err != nil {
		t.Fatalf("json marshal vector failed: %v", err)
	}
	var decoded []float64
	if err := json.Unmarshal(bytes, &decoded); err != nil {
		t.Fatalf("json unmarshal vector failed: %v", err)
	}
	if len(decoded) != 3 || decoded[0] != 0.1 {
		t.Fatalf("unexpected unmarshaled vector: %v", decoded)
	}
}

func TestVectorSearchFlagValidation(t *testing.T) {
	cmd := documentVectorSearchCmd

	fieldFlag := cmd.Flag("field")
	if fieldFlag == nil || fieldFlag.DefValue != "embedding" {
		t.Fatalf("expected default field flag 'embedding', got %v", fieldFlag)
	}

	topKFlag := cmd.Flag("top-k")
	if topKFlag == nil || topKFlag.DefValue != "5" {
		t.Fatalf("expected default top-k flag '5', got %v", topKFlag)
	}

	metricFlag := cmd.Flag("metric")
	if metricFlag == nil || metricFlag.DefValue != "cosine" {
		t.Fatalf("expected default metric flag 'cosine', got %v", metricFlag)
	}
}
