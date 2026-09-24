<?php

namespace App\Http\Resources\Api\V1\Admin;

use App\Models\EpisodeReport;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin EpisodeReport
 */
class AdminReportResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var EpisodeReport $report */
        $report = $this->resource;

        $movieName = $report->episode?->movie?->name;
        $episodeName = $report->episode?->name;
        $serverName = $report->server?->server_name;
        $reporterName = $report->user?->name ?? 'Khách';

        return [
            'id' => $report->id,
            'reportType' => $report->report_type,
            'report_type' => $report->report_type,
            'description' => $report->description,
            'status' => $report->status instanceof \BackedEnum ? $report->status->value : $report->status,
            'adminNote' => $report->admin_note,
            'admin_note' => $report->admin_note,
            'movieName' => $movieName,
            'movie_name' => $movieName,
            'episodeName' => $episodeName,
            'episode_name' => $episodeName,
            'serverName' => $serverName,
            'server_name' => $serverName,
            'reporterName' => $reporterName,
            'reporter_name' => $reporterName,
            'movie' => $report->episode?->movie ? [
                'id' => $report->episode->movie->id,
                'name' => $report->episode->movie->name,
                'slug' => $report->episode->movie->slug,
            ] : null,
            'episode' => $report->episode ? [
                'id' => $report->episode->id,
                'name' => $report->episode->name,
                'slug' => $report->episode->slug,
            ] : null,
            'server' => $report->server ? [
                'id' => $report->server->id,
                'serverName' => $report->server->server_name,
                'server_name' => $report->server->server_name,
            ] : null,
            'user' => $report->user ? [
                'id' => $report->user->id,
                'name' => $report->user->name,
                'email' => $report->user->email,
            ] : null,
            'createdAt' => $report->created_at?->toIso8601String() ?? '',
            'created_at' => $report->created_at?->toIso8601String() ?? '',
            'resolvedAt' => $report->resolved_at?->toIso8601String() ?? null,
            'resolved_at' => $report->resolved_at?->toIso8601String() ?? null,
        ];
    }
}
